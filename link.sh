#!/usr/bin/env bash
echo "cleaning.."
npm run clean

echo "building.."
npm run build

echo "linking.."
#sudo is needed on my mac but should not be necessary
sudo npm unlink ff-serli-openfeature-provider-server
sudo npm link
